mod tokenizer;
use tokenizer::*;
mod ast;

pub fn parse<'a>(str: &'a str) -> Result<ast::Expression<'a>, &'static str> {
  parse_fragment(&mut Tokenizer::new(str))
}

fn parse_fragment<'a>(tok: &mut Tokenizer<'a>) -> Result<ast::Expression<'a>, &'static str> {
  let mut children: Vec<ast::Expression<'a>> = vec![];

  while !tok.is_eof() {
    children.push(parse_node(tok)?);
    tok.eat_whitespace();
  }

  if children.len() == 1 {
    Ok(children.pop().unwrap())
  } else {
    Ok(ast::Expression {
      item: ast::Grammar::Fragment(ast::Fragment { children })
    })
  }
}

fn parse_node<'a>(tok: &mut Tokenizer<'a>) -> Result<ast::Expression<'a>, &'static str> {
  tok.eat_whitespace();
  let token = tok.next()?;
  match token {
    Token::Word(text) => Ok(ast::Expression { item: ast::Grammar::Text(text) }),
    Token::SlotOpen => parse_slot(tok),
    Token::LessThan => parse_element(tok),
    _ => Err("Unkown element")
  }
}

fn parse_slot<'a>(tok: &mut Tokenizer<'a>) -> Result<ast::Expression<'a>, &'static str> {
  let script = get_buffer(tok, |token| { token != Token::SlotClose })?;
  tok.next()?;
  Ok(ast::Expression {
    item: ast::Grammar::Slot(script)
  })
}

fn parse_element<'a>(tok: &mut Tokenizer<'a>) -> Result<ast::Expression<'a>, &'static str> {
  let tag_name = parse_tag_name(tok)?;
  let attributes = parse_attributes(tok)?;
  let mut children: Vec<ast::Expression<'a>> = vec![];

  tok.eat_whitespace();
  
  match tok.next()? {
    Token::SelfCloseTag => {
    },
    Token::GreaterThan => {
      tok.eat_whitespace();
      while tok.peek()? != Token::CloseTag {
        children.push(parse_node(tok)?);
        tok.eat_whitespace();
      }

      tok.next()?;
      let end_tag_name = parse_tag_name(tok)?;
      tok.next()?; 
    },
    _ => {
      return Err("Unexpected token")
    }
  }

  

  Ok(ast::Expression {
    item: ast::Grammar::Element(ast::Element {
      tag_name,
      attributes,
      children
    })
  })
}


fn get_buffer<'a, FF>(tok: &mut Tokenizer<'a>, until: FF) -> Result<&'a str, &'static str> where
  FF: Fn(Token) -> bool {
  let start = tok.pos;
  let mut end = start;
  tok.next()?;
  while !tok.is_eof() {
    end = tok.pos;
    if !until(tok.peek()?) {
      break;
    }
    tok.next()?;
  }

  Ok(std::str::from_utf8(&tok.source[start..end]).unwrap())
}

fn parse_tag_name<'a>(tok: &mut Tokenizer<'a>) -> Result<&'a str, &'static str> {
  get_buffer(tok, |tok| -> bool { !matches!(tok, tokenizer::Token::Whitespace | tokenizer::Token::GreaterThan | tokenizer::Token::Equals) })
}

fn parse_attributes<'a>(tok: &mut Tokenizer<'a>) -> Result<Vec<ast::Expression<'a>>, &'static str> {

  let mut attributes: Vec<ast::Expression<'a>> = vec![];

  loop {
    tok.eat_whitespace();
    match tok.peek()? {
      Token::SelfCloseTag | Token::GreaterThan => break,
      _ => {
        attributes.push(parse_attribute(tok)?);
      }
    }
  }

  Ok(attributes)
}


fn parse_attribute<'a>(tok: &mut Tokenizer<'a>) -> Result<ast::Expression<'a>, &'static str> {
  let name = parse_tag_name(tok)?;
  let mut value = None;

  if tok.peek()? == Token::Equals {
    tok.next()?; // eat =
    value = Some(Box::new(parse_attribute_value(tok)?));
  }

  Ok(ast::Expression {
    item: ast::Grammar::Attribute(ast::Attribute {
      name,
      value
    })
  })
}

fn parse_attribute_value<'a>(tok: &mut Tokenizer<'a>) -> Result<ast::Expression<'a>, &'static str> {
  match tok.peek()? {
    Token::SingleQuote | Token::DoubleQuote => parse_string(tok),
    _ => Err("Unexpected token")
  }
}

fn parse_string<'a>(tok: &mut Tokenizer<'a>) -> Result<ast::Expression<'a>, &'static str> {
  let quote = tok.next()?;
  let value = get_buffer(tok, |tok| -> bool { tok != quote })?;
  tok.next()?; // eat
  Ok(ast::Expression {
    item: ast::Grammar::String(value)
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn can_parse_a_simple_text_node() {
    let expr = parse("abc").unwrap();
    let eql = ast::Expression {
      item: ast::Grammar::Text("abc")
    };

    assert_eq!(expr, eql);
  }

  #[test]
  fn can_parse_a_simple_self_closing_element() {
    let expr = parse("<div />").unwrap();
    let eql = ast::Expression {
      item: ast::Grammar::Element(ast::Element {
        tag_name: "div",
        attributes: vec![],
        children: vec![]
      })
    };

    assert_eq!(expr, eql);
  }

  #[test]
  fn can_parse_an_element_with_an_attribute_name() {
    let expr = parse("<div a />").unwrap();
    let eql = ast::Expression {
      item: ast::Grammar::Element(ast::Element {
        tag_name: "div",
        attributes: vec! [
          ast::Expression {
            item: ast::Grammar::Attribute(ast::Attribute {
              name: "a",
              value: None
            })
          }
        ],
        children: vec![]
      })
    };

    assert_eq!(expr, eql);
  }
  #[test]
  fn can_parse_an_element_with_an_attribute_value() {
    let expr = parse("<div a='b' />").unwrap();
    let eql = ast::Expression {
      item: ast::Grammar::Element(ast::Element {
        tag_name: "div",
        attributes: vec! [
          ast::Expression {
            item: ast::Grammar::Attribute(ast::Attribute {
              name: "a",
              value: Some(Box::new(ast::Expression {
                item: ast::Grammar::String("b")
              }))
            })
          }
        ],
        children: vec![]
      })
    };

    assert_eq!(expr, eql);
  }

  #[test]
  fn can_parse_multiple_values() {
    let expr = parse("<div a='b' c d />").unwrap();
    let eql = ast::Expression {
      item: ast::Grammar::Element(ast::Element {
        tag_name: "div",
        attributes: vec! [
          ast::Expression {
            item: ast::Grammar::Attribute(ast::Attribute {
              name: "a",
              value: Some(Box::new(ast::Expression {
                item: ast::Grammar::String("b")
              }))
            })
          },
          ast::Expression {
            item: ast::Grammar::Attribute(ast::Attribute {
              name: "c",
              value: None
            })
          },
          ast::Expression {
            item: ast::Grammar::Attribute(ast::Attribute {
              name: "d",
              value: None
            })
          }
        ],
        children: vec![]
      })
    };

    assert_eq!(expr, eql);
  }


  #[test]
  fn can_parse_children() {
    let expr = parse("<div> <span /></div>").unwrap();
    let eql = ast::Expression {
      item: ast::Grammar::Element(ast::Element {
        tag_name: "div",
        attributes: vec! [],
        children: vec![
          ast::Expression {
            item: ast::Grammar::Element(ast::Element {
              tag_name: "span",
              attributes: vec! [],
              children: vec![]
            })
          }
        ]
      })
    };

    assert_eq!(expr, eql);
  }

}